# Troubleshooting Guide

This guide covers common issues and their solutions when running WaterCrawl self-hosted.

## Common Issues

### Services Not Starting

#### Symptoms
- Services fail to start
- Docker containers exit immediately
- Error messages in docker logs

#### Solutions
1. Check container logs:
   ```bash
   docker compose logs [service_name]
   ```

2. Verify environment configurations:
   ```bash
   docker compose config
   ```

3. Check system resources:
   ```bash
   docker stats
   ```

4. Ensure all required ports are available:
   ```bash
   netstat -tulpn | grep LISTEN
   ```

### Database Connection Issues

#### Symptoms
- App fails to connect to database
- Database-related error messages
- Slow database operations

#### Solutions
1. Verify PostgreSQL is running:
   ```bash
   docker compose ps postgres
   ```

2. Check database logs:
   ```bash
   docker compose logs postgres
   ```

3. Verify database credentials in `db.env`

4. Test database connection:
   ```bash
   docker compose exec postgres psql -U [username] -d [database]
   ```

### Storage Issues

#### Symptoms
- File upload failures
- Missing media files
- MinIO console inaccessible

#### Solutions
1. Check MinIO credentials match in both `minio.env` and `app.env`

2. Verify MinIO is running:
   ```bash
   docker compose ps minio
   ```

3. Check MinIO logs:
   ```bash
   docker compose logs minio
   ```

4. Test MinIO connectivity:
   ```bash
   curl http://localhost:9000/minio/health/live
   ```

### Memory Issues

#### Symptoms
- Services crashing
- Out of memory errors
- Slow performance

#### Solutions
1. Check memory usage:
   ```bash
   docker stats
   ```

2. Adjust container memory limits in `docker-compose.yml`

3. Monitor system memory:
   ```bash
   free -m
   ```

4. Clear Docker system:
   ```bash
   docker system prune
   ```

### Network Issues

#### Symptoms
- Services can't communicate
- External access problems
- SSL/TLS errors

#### Solutions
1. Check Docker network:
   ```bash
   docker network ls
   docker network inspect watercrawl_default
   ```

2. Verify port mappings:
   ```bash
   docker compose ps
   ```

3. Test internal network:
   ```bash
   docker compose exec app ping postgres
   ```

4. Check SSL certificates if using HTTPS

## Debugging Tools

### Docker Debugging
```bash
# View container details
docker inspect [container_id]

# Execute command in container
docker compose exec [service] [command]

# View container logs
docker compose logs -f [service]
```

### Database Debugging
```bash
# Connect to database
docker compose exec postgres psql -U [username] -d [database]

# Check database size
SELECT pg_size_pretty(pg_database_size('[database]'));

# Check active connections
SELECT * FROM pg_stat_activity;
```

## Getting Help

If you're still experiencing issues:

1. Check the [GitHub Issues](https://github.com/watercrawl/self-hosted/issues)
2. Search the [Documentation](https://docs.watercrawl.dev)
3. Join our [Discord Community](https://discord.gg/8bwgBWeXYr)
4. Open a new issue with:
   - Detailed problem description
   - Error messages
   - System information
   - Relevant logs
