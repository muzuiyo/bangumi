import siteConfig from "@/site.config";

const Footer = () => {
    return (
        <footer>
            <p><a href={siteConfig.homepage} target="_blank" rel="noopener noreferrer">@{siteConfig.author}</a></p>
        </footer>
    );
}

export default Footer;