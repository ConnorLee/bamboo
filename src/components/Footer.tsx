export default function Footer() {
  return (
    <footer>
      <div className="mb-4 flex-none">
        <div className="mt-8 space-x-6 flex justify-center">
          <a
            href="https://twitter.com/bamboo_money" 
            className="social"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sr-only">Twitter</span>
            <img width="60px" height="60px" src="/twitter.svg" />
          </a>

          <a
            href="https://discord.gg/x5ehFP7P" 
            className="social"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sr-only">Discord</span>
            <img width="60px" height="60px" src="/discord.svg" />
          </a>

          <a
            href="https://bamboo-money.medium.com/"
            className="social"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sr-only">Medium</span>
            <img width="60px" height="60px" src="/medium.svg" />
          </a>

          <a
            href="https://docs.bamboo.money/"
            className="social"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sr-only">Gitbook</span>
            <img width="60px" height="60px" src="/gitbook.svg" />
          </a>
        </div>
       
      </div>
    </footer>
  );
}
