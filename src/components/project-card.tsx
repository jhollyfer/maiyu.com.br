import React from "react";

interface ProjectCardProps {
  title: string;
  description: string;
  tech: string[];
  image: string;
  delay?: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  tech,
  image,
  delay = 0,
}) => {
  return (
    <div
      className="glass-card rounded-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-maiyu-dark to-transparent z-10 opacity-0 group-hover:opacity-70 transition-opacity duration-500" />
        <img
          src={image}
          alt={title}
          className="w-full aspect-video object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
        />
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold mb-3 text-white group-hover:text-maiyu-green transition-colors duration-300">
          {title}
        </h3>
        <p className="text-white/70 mb-5 flex-1">{description}</p>
        <div className="flex flex-wrap gap-2">
          {tech.map((item, i) => (
            <span
              key={i}
              className="text-xs py-1 px-3 rounded-full bg-white/10 text-white/80 border border-white/5"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
