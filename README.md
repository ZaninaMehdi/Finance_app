
# Stock Overflow - AI Web Application for Financial Analysts

**Stock Overflow** is an AI-powered web application designed to assist financial analysts by providing insightful AI-driven tools. The application combines cutting-edge technologies to deliver features such as AI chatbots, sentiment analysis, and advanced financial metrics analysis, making the decision-making process more efficient and data-driven.

## Table of Contents
1. [Features](#features)
2. [Technologies Used](#technologies-used)
3. [Setup Guide](#setup-guide)
    - [Backend Configuration](#backend-configuration)
    - [Frontend Setup](#frontend-setup)
4. [How to Run](#how-to-run)
5. [Usage](#usage)
6. [Contributing](#contributing)
7. [License](#license)

## Features

- **Capital Mind AI Chatbot**: Personalized AI chatbot tailored to the user's needs for in-depth financial analysis.
- **AI Summarization**: Generates concise summaries of annual reports using advanced AI models.
- **Sentiment Analysis**: Compares sentiment analysis based on news from multiple sources (e.g., Google News, Yahoo Finance, News API) against financial data sentiment analysis.
- **Key Metrics Display**: Shows essential company metrics and financial data with technical and fundamental analysis using models like Claude 3.
- **Multi-Company Agent Architecture**: Full implementation for creating agents for different companies with efficient data updates and knowledge bases.

## Technologies Used

- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Python, Flask, hosted on AWS SageMaker Studio
- **Tunneling**: ngrok for exposing the local server to the web
- **AI Models**: Claude 3 and other supporting models
- **Data Sources**: News and financial data from various APIs

## Setup Guide

### Backend Configuration

1. **Launch SageMaker Studio**:
   - Go to the AWS Management Console.
   - Navigate to **SageMaker** and create a Studio environment.
   - Open **JupyterLab** from the Studio environment.

2. **Clone the Repository**:
   - In the JupyterLab terminal, run:
     ```bash
     git clone <GitHub repository link>
     ```

3. **Install ngrok**:
   - In a terminal, run the following commands to install and set up ngrok:
     ```bash
     curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc        | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null        && echo "deb https://ngrok-agent.s3.amazonaws.com buster main"        | sudo tee /etc/apt/sources.list.d/ngrok.list        && sudo apt update        && sudo apt install ngrok
     ```

   - Authenticate ngrok:
     ```bash
     ngrok config add-authtoken <your-ngrok-token>
     ```

   - Start ngrok on port 80:
     ```bash
     ngrok http 80
     ```

   - Copy the generated ngrok URL for use in the frontend configuration.

4. **Run the Backend Server**:
   - In another terminal, navigate to the backend directory:
     ```bash
     cd Finance_app/flaskProject
     ```
   - Start the Flask server:
     ```bash
     python app.py
     ```

### Frontend Setup

1. **Navigate to the Frontend Directory**:
   ```bash
   cd Finance_app/app-ui
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Update API Base URL**:
   - Replace `API_BASE_URL` in the following files with the ngrok URL (without `/api`):
     - `apiService.ts`
     - `comprehensiveAnalysisService.ts`
     - `uploadService.ts`
   ```typescript
   const API_BASE_URL = "https://<your-ngrok-url>/api";
   ```

4. **Start the Frontend Development Server**:
   ```bash
   npm run dev
   ```

## How to Run

- **Backend**: Ensure the Flask server is running on SageMaker Studio.
- **ngrok**: Keep the ngrok tunnel active and use the generated URL for the frontend.
- **Frontend**: Run the frontend using `npm run dev` and access it via the local development server link.

## Usage

- **AI Chatbot**: Navigate to the Capital Mind chatbot feature for financial insights and queries.
- **Annual Report Summarization**: Upload annual reports and receive AI-generated summaries.
- **Sentiment Analysis**: View comparative sentiment analyses based on news sources and financial data.
- **Financial Metrics and Analysis**: Explore technical and fundamental analyses for different companies.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any proposed changes.

## License

This project is licensed under the [MIT License](LICENSE).
