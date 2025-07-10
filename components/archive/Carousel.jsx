import { useState, useRef } from "react";
import ExpandableCard from "./Expandable";
import '@fortawesome/fontawesome-free/css/all.min.css';

import styles from "./Carousel.module.css"; // asegúrate que exista

export default function Carousel({ title, items }) {
  const slideRef = useRef(null);
  const [activeCard, setActiveCard] = useState(null);

  const next = () => {
    const first = slideRef.current.children[0];
    slideRef.current.appendChild(first);
  };

  const prev = () => {
    const last = slideRef.current.children[slideRef.current.children.length - 1];
    slideRef.current.prepend(last);
  };

  return (
    <div className={styles.container}>
      <div className={styles.slide} ref={slideRef}>
        {items.map((item, i) => (
          <div
            key={i}
            className={styles.item}
            style={{ backgroundImage: `url(${item.src})` }}
          >
            <div className={styles.content}>
              <div className={styles.name}>{item.title}</div>
              <div className={styles.des}>
                {item.autor && item.autor.includes(',')
                  ? item.autor.split(',')[0] + '...'
                  : item.autor}
              </div>
              <div className={styles.des}>{item.tecnica}</div>
              <button onClick={() => setActiveCard(item)}>Ver mas</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.button}>
        <button onClick={prev} className={styles.prev}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <button onClick={next} className={styles.next}>
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>

      {activeCard && (
        <ExpandableCard card={activeCard} onClose={() => setActiveCard(null)} />
      )}
    </div>
  );
}
