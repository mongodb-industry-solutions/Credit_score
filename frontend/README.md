# Installation of the frontend

This is a [Next.js](https://nextjs.org/) project bootstrapped with [create-next-app](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, make sure that you have npm or yarn installed in your computer, if you don't please check how to here:
- [npm installation](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [yarn installation](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)

Next, please make sure to add a .env file in the folder <location_of_your_repo>/Credit_score/frontend.
It should include the following :

```md
MONGODB_URI=<your_MONGODB_URI>
NEXT_PUBLIC_MONGODB_DB=bfsi-genai
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
NEXT_PUBLIC_CHART_URL=<Your_CHART_URL>
```

> [!Note]
> if the backend was deployed into a server then you have to put the server's IP address in the NEXT_PUBLIC_API_URL above.
> If you want to display a chart here you can do so by following the optional instructions down below.

Lastly, run the development server:

```bash
npm run dev
# or
yarn dev
```

Once you have done everything, we can move on to the next part:
- Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
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
