export default function Footer() {
  return (
    <footer>
      <div className="mb-4 flex-none">
        <div className="mt-8 space-x-6 flex justify-center">
          <a
            href="#"
            className="text-gray-400 hover:text-gray-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sr-only">Facebook</span>
            <img width="60px" height="60px" src="/twitter.png" />
          </a>

          <a
            href="#"
            className="text-gray-400 hover:text-gray-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sr-only">Instagram</span>
            <img width="60px" height="60px" src="/discord.png" />
          </a>

          <a
            href="#"
            className="text-gray-400 hover:text-gray-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sr-only">Twitter</span>
            <img width="60px" height="60px" src="/medium.png" />
          </a>

          <a
            href="#"
            className="text-gray-400 hover:text-gray-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sr-only">GitHub</span>
            <img width="60px" height="60px" src="/gitbook.png" />
          </a>
        </div>
        <p className="mt-4 text-center text-base text-gray-400">
          Bamboo Finance
        </p>
      </div>
    </footer>
  );
}
