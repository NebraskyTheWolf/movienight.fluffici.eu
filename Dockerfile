FROM node:18-bookworm

WORKDIR /app

COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

COPY . .

# Build the Next.js application
RUN npm run build

# Set environment variables for production
ENV NODE_ENV=production

EXPOSE 3000

CMD HOSTNAME="movienight-beta" npm run start
