FROM node:18 As build

# Create app directory
WORKDIR /usr/src

# Install app dependencies
COPY package.json yarn.lock ./

RUN yarn

# Bundle app source
COPY . .

# Set version and build
RUN yarn version --new-version $(git describe --tags) --no-git-tag-version
RUN yarn build

# Install only production dependencies
RUN rm -rf node_modules/
RUN yarn --production

# ------

FROM node:18-alpine

# Move the build files from build folder to app folder
WORKDIR /usr/app
COPY --from=build /usr/src/dist ./
COPY --from=build /usr/src/node_modules ./node_modules/

# Expose the API port
EXPOSE 3000

CMD ["node", "index"]

