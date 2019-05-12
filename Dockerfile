FROM node:lts

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# Wildcard is used to ensure both package.json and package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 8080

CMD [ "npm", "start" ]