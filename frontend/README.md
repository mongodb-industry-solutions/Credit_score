# Installation of the frontend

This is a [Next.js](https://nextjs.org/) project bootstrapped with [create-next-app](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, make sure that you have npm or yarn installed in your computer, if you don't please check how to here:
- [npm installation](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [yarn installation](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)

Next, please make sure to add a `.env` file in the folder `<location_of_your_repo>/Credit_score/frontend`.

**⚠️ IMPORTANT:** Never commit your `.env` file to version control! It may contain sensitive configuration.

Create your `.env` file with the following variables:

```bash
# Backend API URL (for browser-side calls)
# This is embedded at build time and visible to users
# ⚠️ WARNING: This value is embedded in the JavaScript bundle
NEXT_PUBLIC_API_URL=http://localhost:8080

# Node environment
NODE_ENV=dev

# MongoDB Charts URL (optional - for displaying charts)
# Get this from MongoDB Atlas Charts embedding settings
NEXT_PUBLIC_CHART_URL=<Your_CHART_URL>
```

> [!Warning]
> Replace `<Your_CHART_URL>` with your actual MongoDB Charts URL if you want to display charts. The `.env` file is gitignored and will not be committed to the repository.

> [!Note]
> - **MongoDB is NOT required on the frontend** - All database operations are handled by the backend API via proxy routes
> - The frontend uses Next.js API proxy pattern - all backend calls go through `/api/*` routes (no CORS issues)
> - API clients are in `utils/api/` - use these instead of direct fetch calls
> - If the backend was deployed to a server, update `NEXT_PUBLIC_API_URL` in `.env` and rebuild
> - If you want to display a chart, follow the optional instructions below

Lastly, run the development server:

```bash
npm run dev
# or
yarn dev
```

Once you have done everything, we can move on to the next part:
- Open [http://localhost:8080](http://localhost:8080) with your browser to see the result.
- Or go back [to the main page](../)


## Adding a Chart into your application (optional)

- From Atlas UI (not compass), navigate to your "credit_history" collection.
- Click the "Visualize Your Data" button under the tabs.
- Select the chart type "Number"
- drag and drop MonthlyIncome.
- Choose "Median" on the aggregation
- Click on "save and close" on the top right corner.

Your report has been created now next we need to modify the access rights:
- From the Charts UI, click on the "Embedding" tab on the sidebar.
- find your report and click on the settings button on the right part of the screen
- Activate the "Unauthenticated access"
- At the bottom you will have the embedded code to add it to your website. Copy the URL on it and paste it on the NEXT_PUBLIC_CHART_URL variable on the location_of_your_repo>/Credit_score/frontend/.env file.
