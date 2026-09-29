In this stage, you'll extend the `decode` command to support bencoded dictionaries.

A dictionary is encoded as `d<key1><value1>...<keyN><valueN>e`. `<key1>`, `<value1>` etc. correspond to the bencoded keys & values. The keys are sorted in lexicographical order and must be strings.

For example, `{"hello": 52, "foo":"bar"}` would be encoded as: `d3:foo3:bar5:helloi52ee` (note that the keys were reordered).

Here’s how the tester will execute your program:
```
$ ./your_program.sh decode d3:foo3:bar5:helloi52ee
{"foo":"bar","hello":52}
```


If you'd prefer to use a library for this stage, [bencode-go](https://github.com/jackpal/bencode-go) is available for you to use.




