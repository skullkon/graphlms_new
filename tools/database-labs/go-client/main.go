package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func run() error {
	member := flag.Int64("member", 1, "reader id")
	flag.Parse()
	if *member <= 0 {
		return fmt.Errorf("member must be positive")
	}
	dsn := os.Getenv("DB_LAB_URL")
	if dsn == "" {
		return fmt.Errorf("set DB_LAB_URL to your new teaching database")
	}
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("cannot configure PostgreSQL driver")
	}
	defer db.Close()
	db.SetMaxOpenConns(2)
	db.SetMaxIdleConns(1)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	// Do not print raw connection errors: a DSN may contain a password.
	if err := db.PingContext(ctx); err != nil {
		return fmt.Errorf("database unavailable (3 second deadline)")
	}
	rows, err := db.QueryContext(ctx, `SELECT m.id, m.name, m.email, l.id
 FROM club.members AS m LEFT JOIN club.loans AS l
 ON l.member_id=m.id AND l.returned_on IS NULL
 WHERE m.id=$1 ORDER BY l.id`, *member)
	if err != nil {
		return fmt.Errorf("reader query failed")
	}
	defer rows.Close()
	found := false
	for rows.Next() {
		var id int64
		var name string
		var email sql.NullString
		var loan sql.NullInt64
		if err := rows.Scan(&id, &name, &email, &loan); err != nil {
			return fmt.Errorf("cannot decode reader row")
		}
		found = true
		address := "NULL"
		if email.Valid {
			address = email.String
		}
		active := "none"
		if loan.Valid {
			active = fmt.Sprint(loan.Int64)
		}
		fmt.Printf("member=%d name=%s email=%s active_loan=%s\n", id, name, address, active)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("reading reader rows failed")
	}
	if !found {
		fmt.Println("reader not found")
	}
	return nil
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
