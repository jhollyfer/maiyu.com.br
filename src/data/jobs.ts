export type JobListing = {
  id: string;
  titleKey: string;
  location: "remote";
  type: "fulltime";
};

export const jobs: JobListing[] = [
  {
    id: "senior-frontend",
    titleKey: "career.job1Title",
    location: "remote",
    type: "fulltime",
  },
  {
    id: "product-designer",
    titleKey: "career.job2Title",
    location: "remote",
    type: "fulltime",
  },
  {
    id: "data-analyst",
    titleKey: "career.job3Title",
    location: "remote",
    type: "fulltime",
  },
];
