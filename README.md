# loopback3-test

This is an investigation into making loopback 3 read and write
to separate mysql databases (so that writes can go to a primary
server and reads can go to replicas).

## setup

- install node
- install mysql
- clone this repo

The following commands set up the server and a pair of databases:

- `loopback_wo` is a write-only database with one table
- `loopback_ro` is a read-only copy of the same data

Changes to `loopback_wo` are replicated to `loopback_ro` by a set of triggers.

```bash
$ cd loopback3-test
$ npm install
$ mysql -u root -p < ./data.sql
Enter password: ****
id      text
4       apple
5       banana
6       cherry
7       date
8       elderberry
9       fig
10      grape
11      honeydew
12      imbe
13      jackfruit
14      kiwi
15      lemon
```

running:

```bash
$ node .
Web server listening at: http://localhost:3000
Browse your REST API at http://localhost:3000/explorer
```

Visit http://localhost:3000/explorer to see the API.
Visit http://localhost:3000/api/DataRows to see the data.
