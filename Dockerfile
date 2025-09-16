FROM golang:1.24-alpine

WORKDIR /app

COPY go.* ./

RUN go mod download

COPY ./server ./server 

RUN go build -o main ./server/cmd/api/main.go

EXPOSE 8080

CMD [ "./main" ]