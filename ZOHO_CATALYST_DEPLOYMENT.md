# Zoho Catalyst Deployment Guide

This repository has been fully configured for serverless deployment on **Zoho Catalyst**. It is designed to deploy the React frontend as a **Web Client Hosting** application and the FastAPI backend as an **AppSail** function.

Follow these step-by-step instructions to push the project live.

## Prerequisites
- Ensure you have a Zoho Catalyst account.
- Ensure you have the [Zoho Catalyst CLI](https://docs.catalyst.zoho.com/en/cli/v1/installation/) installed on your machine (`npm install -g zcatalyst-cli`).

---

## Step 1: Build the React Frontend
Before deploying, you must compile the React code into static production files.

1. Open your terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Build the production application:
   ```bash
   npm run build
   ```
4. Return to the root directory:
   ```bash
   cd ..
   ```

---

## Step 2: Initialize Catalyst
Initialize the project in the root folder (where `catalyst.json` is located).

1. Log into your Zoho account via the CLI:
   ```bash
   catalyst login
   ```
2. Initialize the project:
   ```bash
   catalyst init
   ```
   *When prompted, select **Client** and **AppSail**, and choose the project you created in your Catalyst web console.*

---

## Step 3: Connect Frontend to the Live Backend (Crucial)
By default, the React frontend points to `localhost`. You need to point it to your live Catalyst AppSail URL.

1. Inside the `frontend` folder, create a new file named `.env.production`.
2. Add the following line to the file, replacing `<your-appsail-url>` with the URL Zoho Catalyst gives your AppSail function:
   ```env
   VITE_API_URL=https://<your-appsail-url>.catalystappsail.in/api
   ```
3. Re-run `npm run build` inside the `frontend` folder so the React app compiles with the live server URL.

---

## Step 4: Deploy
From the **root of the project**, simply run:

```bash
catalyst deploy
```

Catalyst will automatically upload the built React files from `frontend/dist` to its global CDN, and it will package the `backend` folder and spin up the FastAPI server via AppSail.

**You are now live!**
