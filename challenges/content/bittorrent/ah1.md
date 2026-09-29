In this stage, you'll extend the `decode` command to support bencoded lists.

Lists are encoded as `l<bencoded_elements>e`.

For example, `["hello", 52]` would be encoded as `l5:helloi52ee`. Note that there are no separators between the elements.

Here’s how the tester will execute your program:
```
$ ./your_program.sh decode l5:helloi52ee
[“hello”,52]
```


If you'd prefer to use a library for this stage, [bencode-go](https://github.com/jackpal/bencode-go) is available for you to use.




