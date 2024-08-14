#!/bin/bash

# Stop Neo4j
echo "Stopping Neo4j..."
neo4j stop

# Create a backup directory with the current date and time
backup_dir="bak/$(date +'%m_%d_%Y_%H_%M')"
mkdir -p "$backup_dir"

# Perform the backup
echo "Performing Neo4j backup..."
neo4j-admin dump --to="$backup_dir"
echo "Backup completed. Files stored in $backup_dir"

# Start Neo4j
echo "Starting Neo4j..."
neo4j start

echo "Neo4j backup script completed."
