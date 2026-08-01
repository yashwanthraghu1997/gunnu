// milestones.js - CDC & AAP Scientifically Researched Milestone Categorization
const milestones = [
  {
    category: "Social & Emotional",
    icon: "fa-solid fa-heart",
    color: "#FF7A9C",
    items: [
      { month: 1, title: "Calms to Familiar Voices", description: "Recognizes Mommy's & Daddy's voice and calms down when held." },
      { month: 2, title: "First Social Smile", description: "Smiles intentionally at parents in response to smiles and playful talk." },
      { month: 4, title: "Loves to Play & Laughs", description: "Belly laughs out loud and cries when play stops." },
      { month: 6, title: "Mirror Play Discovery", description: "Enjoys looking at own reflection in mirror and playing peek-a-boo." },
      { month: 9, title: "Stranger & Separation Anxiety", description: "Shows preference for primary caregivers and waves 'bye-bye'." },
      { month: 12, title: "Shows Affection & Hugs", description: "Gives spontaneous hugs, kisses, and smiles to Mommy and Daddy." }
    ]
  },
  {
    category: "Motor Skills & Strength",
    icon: "fa-solid fa-person-running",
    color: "#C89B7B",
    items: [
      { month: 1, title: "Brief Chin Lift", description: "Lifts chin briefly off blanket during tummy time." },
      { month: 3, title: "Steady Head Control", description: "Holds head and chest steady unsupported while lying or sitting." },
      { month: 4, title: "Rolls Tummy to Back", description: "Flips over from tummy to back independently." },
      { month: 6, title: "Sits Unsupported", description: "Sits upright proudly without leaning on hands." },
      { month: 8, title: "Pulls Up to Stand", description: "Pulls up to standing position holding furniture or crib." },
      { month: 12, title: "Independent Walking", description: "Walks independently with balance across the room." }
    ]
  },
  {
    category: "Cognitive & Vision",
    icon: "fa-solid fa-wand-magic-sparkles",
    color: "#E5989B",
    items: [
      { month: 1, title: "Focuses 8-12 Inches", description: "Focuses on parent faces at close feeding distance." },
      { month: 2, title: "180-Degree Visual Tracking", description: "Follows moving toys smoothly from side to side." },
      { month: 3, title: "Reaches for Toys", description: "Opens fists to swipe at and grasp dangling rattles." },
      { month: 5, title: "Transfers Toys Between Hands", description: "Passes objects smoothly from left to right hand." },
      { month: 7, title: "Object Permanence", description: "Searches for toys hidden under a blankie or box." },
      { month: 10, title: "Pincer Grasp Mastery", description: "Picks up small items with thumb and index finger." }
    ]
  },
  {
    category: "Language & Communication",
    icon: "fa-solid fa-comments",
    color: "#6B9AC4",
    items: [
      { month: 2, title: "Cooing & Gurgling", description: "Makes sweet 'ooo' and 'aah' vowel sounds." },
      { month: 4, title: "Laughter & Chuckles", description: "Giggles out loud when tickled or played with." },
      { month: 6, title: "Consonant Babbling", description: "Strings sounds together like 'ba-ba', 'da-da', 'ma-ma'." },
      { month: 8, title: "Responds to Her Name", description: "Turns around immediately when called by name." },
      { month: 9, title: "Understands 'No'", description: "Pauses and looks at speaker when hearing 'no'." },
      { month: 12, title: "First Meaningful Words", description: "Says intentional 'Mama', 'Dada', and 'Bye'." }
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = milestones;
}
