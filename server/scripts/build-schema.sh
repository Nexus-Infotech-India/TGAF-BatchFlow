#!/bin/bash
# filepath: /home/rameswar-panda/Nexus/Batchflow/server/scripts/build-schema.sh

OUTPUT_DIR="./prisma"
OUTPUT_FILE="${OUTPUT_DIR}/schema.prisma"
SCHEMA_DIR="./prisma/schema"

echo "Building combined Prisma schema..."

# Ensure output directory exists
mkdir -p $OUTPUT_DIR

# Start with a clean file and add header
echo "// Auto-generated schema - DO NOT EDIT DIRECTLY" > $OUTPUT_FILE
echo "// Generated on: $(date)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Add generator and datasource blocks manually
cat << EOF >> $OUTPUT_FILE
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
EOF

echo "" >> $OUTPUT_FILE

# Check if the schema files exist before attempting to process them
if [ -f "$SCHEMA_DIR/schema.prisma" ]; then
  echo "// Models and enums from schema.prisma" >> $OUTPUT_FILE
  # Extract model definitions and enums from schema.prisma
  sed -n '/^model\|^enum/,/^}/p' $SCHEMA_DIR/schema.prisma >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
else
  echo "Warning: $SCHEMA_DIR/schema.prisma not found"
fi

if [ -f "$SCHEMA_DIR/training.prisma" ]; then
  echo "// Models and enums from training.prisma" >> $OUTPUT_FILE
  # Extract model definitions and enums from training.prisma
  sed -n '/^model\|^enum/,/^}/p' $SCHEMA_DIR/training.prisma >> $OUTPUT_FILE
else
  echo "Warning: $SCHEMA_DIR/training.prisma not found"
fi

echo "Schema successfully built at $OUTPUT_FILE"