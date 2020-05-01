# Saver

## About

A web page saving application insipred by features mostly from [Wallabag](https://www.wallabag.org/en) and some from others ([Pocket](https://getpocket.com/), Readability, [InstaPaper](https://www.instapaper.com/), etc).  Self-hosting was the primary driver and although [Wallabag](https://www.wallabag.org/en) has done the job quite well, its can be a lot of work to get running, backup and move.  More  importantly it is even harder to customize simple things eventually the need for additional feartures has grown enough to motivate the development of this prjoject.

## Installation

This is a `node.js` based application that can be configures to connecto to an existing `MongoDB` server or use the `docker-compose-dev.yml` file to spin up both in `docker` containers.  You need to build the `saver` service first.  First, cd to the `src` directory (the other directories are part of a larger work in progress).  Then build the service for docker like so:

```bash
docker-compose build
```

Then you can start it up with (if you have a mongodb container or service running already):

```bash
docker-compose up -d
```

or use an attached mongodb container dedicated to this service:

```bash
docker-compose -f docker-compose-dev.yml up -d
```

## Notes

For production, using `docker` you can use the `docker-compose.yml` file but it requires having [Traefik](https://github.com/containous/traefik) setup which is highly adivisable if not hosting locally or on a very private network and `Traefik` makes utilizing [Let's Encrypt](https://letsencrypt.org) so easy. Also, the app's authentication reqlies on `REST` calls, which should also should never be done with ssl.  [Here is](https://www.digitalocean.com/community/tutorials/how-to-use-traefik-as-a-reverse-proxy-for-docker-containers-on-ubuntu-18-04) very good article as a starting point to get this setup with `docker` and `Traefik` with `Let's Encrypt`.
