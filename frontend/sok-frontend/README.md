# SoK Research Dashboard - Frontend

Angular 17 application for the SoK Research Dashboard.

## Development

```bash
npm install
npm start
```

The application will be available at http://localhost:4200

## Build

```bash
npm run build
```

## Tailwind CSS

This project uses Tailwind CSS for styling. The configuration is in `tailwind.config.js`.

## Project Structure

- `src/app/pages/`: Page components (login, register, papers, etc.)
- `src/app/services/`: Angular services for API communication
- `src/app/guards/`: Route guards for authentication and authorization
- `src/app/interceptors/`: HTTP interceptors for adding auth tokens

## Environment Configuration

The API base URL is configured in the services. For production, update the `apiUrl` in each service or use Angular environment files.
