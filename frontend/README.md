# WaterCrawl Frontend

WaterCrawl is a modern web crawling and content extraction platform that transforms website content into LLM-friendly information. It leverages advanced language models to intelligently process and extract meaningful data from web documents. This frontend application provides an intuitive interface for managing crawling tasks, viewing extracted content, and fine-tuning the extraction process.

The platform specializes in:
- Intelligent web crawling with LLM-powered content understanding
- Structured data extraction from various web sources
- Document processing and transformation for LLM compatibility
- Advanced content analysis and organization

## ⚠️ Disclaimer

This is a beta project and is provided "as is" without warranty of any kind, express or implied. The developers make no warranties, representations, or guarantees regarding the use, reliability, accuracy, or completeness of the project.

By using this software:
- You acknowledge that this is a beta version and may contain bugs or issues
- You understand that using this in production is at your own risk
- You accept that the developers are not liable for any damages or losses arising from the use of this software
- You acknowledge that there is no guarantee of continued maintenance or support

We recommend thorough testing in a non-production environment before any production deployment.

## 🚀 Features

- Modern React (18.3.1) with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Authentication with Auth0
- Monaco Editor integration
- Team management and collaboration features
- Responsive design with Headless UI components
- Form handling with react-hook-form and yup validation
- Real-time notifications with react-hot-toast
- Data visualization with Recharts

## 🛠️ Tech Stack

- **Framework:** React 18.3.1
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3.4.16
- **UI Components:** Headless UI, Hero Icons
- **Form Management:** react-hook-form, yup
- **HTTP Client:** Axios
- **Authentication:** Auth0
- **Code Editor:** Monaco Editor
- **Charts:** Recharts

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/watercrawl/frontend.git
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory and add necessary environment variables:
```env
VITE_API_URL=your-api-url
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
# or
yarn dev
```

### Production Build
```bash
npm run build
# or
yarn build
```

### Preview Production Build
```bash
npm run preview
# or
yarn preview
```

## 🐳 Docker Support

Build the Docker image:
```bash
docker build -t watercrawl/frontend .
```

Run the container:
```bash
docker run -p 80:80 watercrawl/frontend
```

## 📁 Project Structure

```
src/
├── assets/          # Static assets
├── components/      # Reusable components
├── config/         # Configuration files
├── contexts/       # React contexts
├── layouts/        # Layout components
├── pages/          # Application pages
├── services/       # API services
├── styles/         # Global styles
├── types/          # TypeScript types
└── utils/          # Utility functions
```

## 🧪 Development Standards

- TypeScript for type safety
- ESLint for code linting
- Component-based architecture
- Responsive design principles
- Accessible UI components
- Team-scoped components for efficient state management

## 🔒 Security Features

- JWT token management
- Team-based access control
- Secure API communication

## 🤝 Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

## 📋 Changelog

See [CHANGELOG.md](https://github.com/watercrawl/frontend/blob/main/CHANGELOG.md) for a list of notable changes and version history.
