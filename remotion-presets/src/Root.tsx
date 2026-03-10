import "./index.css";
import { Composition, staticFile } from "remotion";
import { MyComposition } from "./Composition";
import { TitleCard, TitleCardSchema } from "./presets/TitleCard";
import {
  ArticleHighlight,
  ArticleHighlightSchema,
} from "./presets/ArticleHighlight";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={210}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="TitleCard"
        component={TitleCard}
        schema={TitleCardSchema}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Attention Is All You Need",
          authors: [
            { name: "Ashish Vaswani", affiliation: "Google Brain" },
            { name: "Noam Shazeer", affiliation: "Google Brain" },
            { name: "Niki Parmar", affiliation: "Google Research" },
            { name: "Jakob Uszkoreit", affiliation: "Google Research" },
          ],
          subtitle:
            "A new simple network architecture based solely on attention mechanisms",
          venue: "NeurIPS",
          year: "2017",
          highlightPhrases: ["Attention Is All You Need"],
          highlightColor: "rgba(255, 230, 0, 0.55)",
        }}
      />
      <Composition
        id="ArticleHighlight"
        component={ArticleHighlight}
        schema={ArticleHighlightSchema}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          imageSrc: staticFile("test-article.png"),
          imageWidth: 900,
          imageHeight: 500,
          highlights: [
            {
              phrase: "government shutdown",
              boundingBox: { left: 173, top: 124, width: 160, height: 17 },
            },
            {
              phrase: "funding lapses",
              boundingBox: { left: 61, top: 208, width: 103, height: 17 },
            },
            {
              phrase: "government shutdown",
              boundingBox: { left: 352, top: 356, width: 160, height: 17 },
            },
          ],
          highlightColor: "rgba(255, 230, 0, 0.55)",
        }}
      />
    </>
  );
};
