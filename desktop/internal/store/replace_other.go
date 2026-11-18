//go:build !windows

package store

import "os"

func replace(src, dst string) error { return os.Rename(src, dst) }
