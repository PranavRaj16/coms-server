# Node.js MongoDB Backend

A robust Express backend template integrated with MongoDB Atlas.

## Features
- **ES Modules**: Modern JavaScript syntax.
- **Mongoose**: Elegant MongoDB object modeling.
- **Item CRUD**: Sample resource with Create, Read, Update, and Delete operations.
- **Environment Variables**: Managed via `dotenv`.
- **CORS**: Enabled for cross-origin requests.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory (one has been created for you) with the following content:
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    NODE_ENV=development
    ```

3.  **Run the application**:
    - For development (with nodemon):
      ```bash
      npm run dev
      ```
    - For production:
      ```bash
      npm start
      ```

## API Endpoints

### Health Check
- `GET /api/health`: Check if the backend is running.

### Items
- `GET /api/items`: Get all items.
- `GET /api/items/:id`: Get a single item by ID.
- `POST /api/items`: Create a new item.
- `PUT /api/items/:id`: Update an item.
- `DELETE /api/items/:id`: Delete an item.

## Troubleshooting
If you encounter `Error: querySrv ECONNREFUSED`, please check:
1.  **DNS Settings**: Ensure your network can resolve SRV records.
2.  **IP Whitelist**: Ensure your current IP is added to the MongoDB Atlas Access List.
3.  **Connection String**: Verify that the connection string provided in `.env` is correct.
