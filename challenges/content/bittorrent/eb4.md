In this stage, you'll extend the `decode` command to support bencoded integers.

### Bencode

[Bencode](https://en.wikipedia.org/wiki/Bencode) (pronounced _Bee-encode_) is a serialization format used in [the BitTorrent protocol](https://www.bittorrent.org/beps/bep_0003.html). It is used in torrent files and in communication between trackers and peers.

Bencode supports four data types:

- strings
- integers
- arrays
- dictionaries

In this stage, we'll extend your `decode` command to support bencoded integers

### Bencoded integers

Integers are encoded as `i<number>e`. For example:

- `52` is encoded as `i52e`
- `-52` is encoded as `i-52e`

### Tests

Here's how the tester will execute your program:

```
$ ./your_program.sh decode i52e
52
```


If you'd prefer to use a library for this stage, [bencode-go](https://github.com/jackpal/bencode-go) is available for you to use.





