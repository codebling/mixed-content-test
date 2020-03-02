FROM node:lts-alpine

RUN apk add --no-cache tini

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

RUN ./node_modules/.bin/parcel build public/index.html
EXPOSE 80
EXPOSE 443

ENV DEBUG=*

ENTRYPOINT ["tini", "--"]

CMD ["node", "index.js"]
