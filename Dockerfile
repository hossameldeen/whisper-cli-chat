# Using non-alpine version because one js library needed `git`. So, to be safe, will just use non-alpine for now.
FROM node:8.11.2-stretch

WORKDIR /usr/src/app

# TODO: How to make sure no-one is using `package-lock.json` instead of `yarn.lock`?
COPY package.json yarn.lock ./

# `yarn install` instead of `yarn install --only=production` because I have only one image for dev/testing & production.
RUN yarn install

# Note: This uses .dockerignore
COPY . .

CMD ["yarn", "run", "start"]