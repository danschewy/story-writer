# StoryHearth

StoryHearth is a collaborative storytelling platform where users can create and share stories together. Built with modern web technologies, it provides a seamless experience for writers to collaborate in real-time.

## Features

- **Collaborative Story Writing**: Create stories and invite others to contribute
- **Real-time Updates**: See changes as they happen
- **Image Support**: Add images to your stories
- **Mobile Optimized**: Beautiful experience on all devices
- **Google Authentication**: Secure and easy sign-in
- **Completed Stories Gallery**: Browse and read finished stories

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **UI Components**: Shadcn/ui
- **Icons**: Lucide Icons
- **State Management**: React Context

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/story-hearth.git
cd story-hearth
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
story-hearth/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── completed/         # Completed stories page
│   ├── dashboard/         # User dashboard
│   └── session/           # Story session pages
├── components/            # React components
│   ├── ui/               # UI components
│   └── ...               # Other components
├── lib/                   # Utility functions and configurations
└── public/               # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
