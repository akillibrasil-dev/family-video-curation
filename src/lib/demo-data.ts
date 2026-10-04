export type DemoVideo = {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  category: string;
  tags: string[];
  duration: string;
  madeForKids: boolean | null;
};

export const demoVideos: DemoVideo[] = [
  {
    id: "demo-1",
    youtubeId: "dQw4w9WgXcQ",
    title: "Como funciona um foguete?",
    channel: "Canal Ciência Demo",
    category: "Ciência",
    tags: ["foguete", "espaço", "astronomia", "ciência"],
    duration: "08:42",
    madeForKids: null,
  },
  {
    id: "demo-2",
    youtubeId: "M7lc1UVf-VE",
    title: "Entendendo carros de corrida",
    channel: "Canal Esportes Demo",
    category: "Esportes",
    tags: ["carro", "corrida", "automobilismo", "esportes"],
    duration: "11:16",
    madeForKids: null,
  },
  {
    id: "demo-3",
    youtubeId: "aqz-KE-bpKQ",
    title: "Dinossauros: uma viagem no tempo",
    channel: "Canal História Demo",
    category: "História",
    tags: ["dinossauro", "história", "natureza", "ciência"],
    duration: "09:31",
    madeForKids: true,
  },
];
