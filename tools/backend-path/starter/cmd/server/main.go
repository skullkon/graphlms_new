package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"example.com/backend-path/internal/jobs"
)

func envInt(name string, fallback int) int {
	value := os.Getenv(name)
	if value == "" {
		return fallback
	}
	n, err := strconv.Atoi(value)
	if err != nil || n < 1 {
		log.Fatalf("%s должен быть положительным целым числом", name)
	}
	return n
}

func main() {
	addr := os.Getenv("ADDR")
	if addr == "" {
		addr = "127.0.0.1:8080"
	}
	dataFile := os.Getenv("DATA_FILE")
	if dataFile == "" {
		dataFile = "jobs.json"
	}
	app, err := jobs.New(jobs.Config{Workers: envInt("WORKERS", 2), QueueSize: envInt("QUEUE_SIZE", 16), DataFile: dataFile})
	if err != nil {
		log.Fatal(err)
	}
	server := &http.Server{Addr: addr, Handler: app, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second, IdleTimeout: 30 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	serverErrors := make(chan error, 1)
	go func() { serverErrors <- server.ListenAndServe() }()
	log.Printf("Учебный сервис: http://%s; данные: %s", addr, dataFile)
	select {
	case <-ctx.Done():
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			log.Print(err)
		}
	}
	shutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := app.Shutdown(shutdown); err != nil {
		log.Printf("Остановка обработчиков: %v", err)
	}
	if err := server.Shutdown(shutdown); err != nil {
		log.Printf("Остановка HTTP: %v", err)
		_ = server.Close()
	}
}
