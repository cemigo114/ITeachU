# ITeachU Prototype

Transform assessment by teaching AI - An innovative educational platform where students demonstrate understanding by teaching AI agents to solve mathematics problems.

## Overview

ITeachU is an MVP implementation of a teaching assessment platform featuring the "Stack of Cups" mathematics problem. Students interact with Zippy, an eager AI learner, to explain mathematical concepts and verify their understanding through teaching.

## Features

- **Interactive AI Learner**: Chat with Zippy, an enthusiastic AI that starts with misconceptions
- **Real-time Learning Progress**: Visual ΔLearning metric showing AI comprehension
- **Teaching Tips**: Guidance for effective explanation strategies
- **Responsive Design**: Clean, modern UI built with React and Tailwind CSS

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Anthropic Claude API** - AI conversation backend

## Getting Started

### Prerequisites

- Node.js 16+ installed
- An Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. Clone the repository
```bash
cd ITeachU
```

2. Install dependencies
```bash
npm install
```

3. Configure API key

**REQUIRED**: Add your Anthropic API key to the `.env` file:

```bash
# Edit .env file and replace 'your_api_key_here' with your actual API key
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx
```

Get your API key from: https://console.anthropic.com/

⚠️ **Security Note**: The `.env` file is gitignored and won't be committed. For production use, implement a backend proxy server instead of exposing API keys in the frontend.

4. Start the development server
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Usage

1. Click "Start Teaching Session" on the intro screen
2. Read Zippy's initial attempt at the problem (containing misconceptions)
3. Type explanations in the chat to help Zippy understand:
   - Why cups nest inside each other
   - The concept of the rim/lip adding height
   - How to calculate the pattern
4. Watch the ΔLearning progress bar increase as Zippy understands better
5. Use teaching tips in the sidebar for guidance

## The Stack of Cups Problem

**Given Data**:
- 2 cups stacked = 16 cm tall
- 4 cups stacked = 20 cm tall
- 8 cups stacked = 28 cm tall

**Key Concepts**:
- Cups nest inside each other (not stacked separately)
- Each cup's rim adds 2cm to the total height
- Base cup height = 14cm
- Equation: h = 2n + 12 (where n = number of cups)

## Project Structure

```
ITeachU/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles with Tailwind
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── CLAUDE.md           # AI personality instructions
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Customization

The AI personality and behavior are defined in:
- `CLAUDE.md` - Detailed instructions for the AI learner
- `src/App.jsx` (lines 4-20) - System prompt sent to the API

## Security Considerations

⚠️ **WARNING**: This prototype exposes the Anthropic API key in the frontend code. For production use:

1. Implement a backend API proxy
2. Use environment variables securely
3. Add rate limiting
4. Implement user authentication
5. Monitor API usage

## Future Enhancements

- [ ] Multiple AI personalities (Skeptic Sam, Confused Casey)
- [ ] Session saving and replay
- [ ] Teacher dashboard with analytics
- [ ] Additional mathematics problems
- [ ] Assessment scoring system
- [ ] Multi-language support

## License

This is a prototype/educational project.

## Acknowledgments

Built with Claude Code and inspired by innovative assessment methodologies that measure understanding through teaching.
