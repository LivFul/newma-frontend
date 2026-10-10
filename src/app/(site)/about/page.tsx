import { AboutNewma } from "@/components/site/about-newma";
import { MARKETING_PAGES } from "@/content/home/copy";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  path: "/about",
  title: MARKETING_PAGES.about.title.text,
  description: MARKETING_PAGES.about.description.text,
});

export default function AboutPage() {
  return <AboutNewma pageTitle />;
}
