The challenge: A feature flag service 
Your task is to build a simple, yet effective, feature flag service. This service wi l have 
two main parts: 
1) Admin and API (the back-end): An admin environment that alows an 
administrator to manage feature flags. 
2) Client (the front-end): An application that consumes the feature flags from the 
admin panel and conditionaly renders components and pages.  
Requirements 
Admin and API - Create, view, edit, and delete feature flags. - Include at least one advanced rollout mechanism in addition to a simple boolean 
rollout (on/off for all users). - Provide an API endpoint for the client to query feature flag statuses. 
Client - A very rudimentary UI to manage Car Damage Reports. - Submit a new report 
- View an existing report - Update an existing report - Implement at least three conditionally rendered components and two conditionally 
available features behind feature flags. 
Generic - Define how you will handle cases where a user sees a flagged component, the flag is 
disabled, and the user then tries to interact with it. - - Include a caching strategy that supports high-traffic usage. 
Support scheduled activations and expirations for feature flags. - Optional: Log feature flag decisions and visualise it for monitoring and debugging. 
Non-functional requirements - Use Laravel for the admin environment and API. - Use Next.js for the client application. - You may choose any database. - You may use open-source packages, except those providing ready-made feature flag 
functionality (e.g., Laravel Pennant or similar). We want to see your own 
implementation. 
Deliverable 
Send us a link to a public GitHub repository which contains both the Laravel and Next.js 
codebase. 
Write clear instructions in the README.md on how to run the applications locally. A 
non-running application will heavily impact how we assess your work.