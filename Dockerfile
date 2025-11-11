FROM oven/bun:latest

WORKDIR /user/src/app

COPY package.json bun.lockb* ./

RUN bun install

COPY . .

EXPOSE 8000

CMD ["bun", "run", "index.ts"]