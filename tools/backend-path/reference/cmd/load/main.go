// Copy this standalone program to cmd/load/main.go in the learning project.
package main

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"math"
	"net"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"
	"sync"
	"time"
)

type observation struct {
	status  int
	latency time.Duration
	err     error
}

func main() {
	os.Exit(run(os.Args[1:], os.Stdout, os.Stderr))
}

func run(args []string, out, errOut io.Writer) int {
	flags := flag.NewFlagSet("load", flag.ContinueOnError)
	flags.SetOutput(errOut)
	requests := flags.Int("requests", 200, "number of POST attempts (1..10000)")
	concurrency := flags.Int("concurrency", 8, "concurrent HTTP clients (1..256)")
	baseURL := flags.String("url", "http://127.0.0.1:8080", "local service URL")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 || *requests < 1 || *requests > 10000 || *concurrency < 1 || *concurrency > 256 {
		fmt.Fprintln(errOut, "requests must be 1..10000, concurrency 1..256; positional arguments are not supported")
		return 2
	}
	u, err := url.Parse(*baseURL)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" {
		fmt.Fprintln(errOut, "url must be an HTTP(S) service URL without credentials, query, or fragment")
		return 2
	}
	host := u.Hostname()
	ip := net.ParseIP(host)
	if !strings.EqualFold(host, "localhost") && (ip == nil || !ip.IsLoopback()) {
		fmt.Fprintln(errOut, "this learning client only targets localhost or a loopback IP")
		return 2
	}
	u.Path = strings.TrimRight(u.Path, "/") + "/jobs"
	u.RawPath = ""
	var random [12]byte
	if _, err := rand.Read(random[:]); err != nil {
		fmt.Fprintf(errOut, "cannot generate a run ID: %v\n", err)
		return 1
	}
	prefix := "load-" + hex.EncodeToString(random[:])
	transport := &http.Transport{
		Proxy:               nil, // Local requests must not be sent through an environment proxy.
		MaxIdleConns:        *concurrency,
		MaxIdleConnsPerHost: *concurrency,
		MaxConnsPerHost:     *concurrency,
		IdleConnTimeout:     30 * time.Second,
	}
	defer transport.CloseIdleConnections()
	client := &http.Client{
		Transport: transport,
		Timeout:   5 * time.Second,
		// Report redirects as unexpected HTTP responses, rather than following them.
		CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse },
	}
	indices := make(chan int)
	results := make(chan observation, *requests)
	var workers sync.WaitGroup
	started := time.Now()
	for i := 0; i < *concurrency; i++ {
		workers.Add(1)
		go func() {
			defer workers.Done()
			for n := range indices {
				body, marshalErr := json.Marshal(struct {
					Text string `json:"text"`
				}{Text: fmt.Sprintf("request-%d", n)})
				if marshalErr != nil {
					results <- observation{err: marshalErr}
					continue
				}
				req, requestErr := http.NewRequest(http.MethodPost, u.String(), bytes.NewReader(body))
				if requestErr != nil {
					results <- observation{err: requestErr}
					continue
				}
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("Idempotency-Key", fmt.Sprintf("%s-%d", prefix, n))
				before := time.Now()
				resp, requestErr := client.Do(req)
				status := 0
				if resp != nil {
					status = resp.StatusCode
					_, readErr := io.Copy(io.Discard, io.LimitReader(resp.Body, 1<<20))
					closeErr := resp.Body.Close()
					if requestErr == nil {
						requestErr = readErr
					}
					if requestErr == nil {
						requestErr = closeErr
					}
				}
				results <- observation{status: status, latency: time.Since(before), err: requestErr}
			}
		}()
	}
	for i := 0; i < *requests; i++ {
		indices <- i
	}
	close(indices)
	workers.Wait()
	close(results)
	elapsed := time.Since(started)
	latencies := make([]time.Duration, 0, *requests)
	accepted, overloaded, unavailable, otherHTTP, networkErrors := 0, 0, 0, 0, 0
	var firstError error
	for result := range results {
		latencies = append(latencies, result.latency)
		switch result.status {
		case http.StatusAccepted:
			accepted++
		case http.StatusTooManyRequests:
			overloaded++
		case http.StatusServiceUnavailable:
			unavailable++
		case 0: // No HTTP response received.
		default:
			otherHTTP++
		}
		if result.err != nil {
			networkErrors++
			if firstError == nil {
				firstError = result.err
			}
		}
	}
	sort.Slice(latencies, func(i, j int) bool { return latencies[i] < latencies[j] })
	percentile := func(p float64) time.Duration {
		index := int(math.Ceil(float64(len(latencies))*p)) - 1
		if index < 0 {
			index = 0
		}
		return latencies[index]
	}
	fmt.Fprintf(out, "requests=%d concurrency=%d elapsed=%s run_id=%s\n", *requests, *concurrency, elapsed.Round(time.Microsecond), prefix)
	fmt.Fprintf(out, "http_202=%d http_429=%d http_503=%d other_http=%d network_errors=%d\n", accepted, overloaded, unavailable, otherHTTP, networkErrors)
	fmt.Fprintf(out, "http_attempt_latency p50=%s p95=%s max=%s\n", percentile(0.50).Round(time.Microsecond), percentile(0.95).Round(time.Microsecond), latencies[len(latencies)-1].Round(time.Microsecond))
	fmt.Fprintf(out, "admission_rps=%.2f (HTTP 202 / elapsed; background completion is not measured)\n", float64(accepted)/elapsed.Seconds())
	if firstError != nil {
		fmt.Fprintf(errOut, "first request error: %v\n", firstError)
	}
	if unavailable > 0 || otherHTTP > 0 || networkErrors > 0 {
		return 1
	}
	return 0 // HTTP 429 is an expected overload response.
}
