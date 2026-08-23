import { useState, useRef, useEffect, useContext, Children } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Button from "../button/Button";
import styles from "./Sidebar.module.css";
import { sidebarContext } from "../../context/sidebar";
import { boardContext } from "../../context/board";

export default function Sidebar({
    children,
    title = "Choose a backplate",
}) {
    const childArray = Children.toArray(children);
    const context = useContext(sidebarContext);
    const { setMaterial, isStageComplete } = useContext(boardContext) || {};
    const [localActiveIdx, setLocalActiveIdx] = useState(0);
    const activeIdx = context ? context.activeIdx : localActiveIdx;
    const setActiveIdx = context ? context.setActiveIdx : setLocalActiveIdx;

    const [direction, setDirection] = useState("next");
    const contentRef = useRef(null);

    const hasChildren = childArray.length > 0;
    const isFirst = activeIdx === 0;
    const isLast = activeIdx >= childArray.length - 1;
    const isCurrentStageComplete = isStageComplete ? isStageComplete(activeIdx) : true;

    const currentTitle = childArray[activeIdx]?.props?.title || title;

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [activeIdx]);

    const handleBack = () => {
        if (activeIdx === childArray.length - 1) {
            setMaterial?.(null);
        }
        setDirection("back");
        setActiveIdx((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        if (!isCurrentStageComplete) return;
        setDirection("next");
        setActiveIdx((prev) => Math.min(childArray.length - 1, prev + 1));
    };

    return (
        <nav className={styles.sidebar}>
            <div className={styles.heading}>
                <h2>{currentTitle}</h2>
            </div>
            <div ref={contentRef} className={styles.content}>
                {hasChildren ? (
                    <div
                        key={activeIdx}
                        className={`${styles.slideContent} ${
                            direction === "next" ? styles.slideNext : styles.slideBack
                        }`}
                    >
                        {childArray[activeIdx]}
                    </div>
                ) : (
                    <span className={styles.nothing}>There's nothing here!</span>
                )}
            </div>
            <div className={styles.controls}>
                <Button 
                    variant="secondary"
                    leftIcon={<ArrowLeft size={16} />}
                    disabled={!hasChildren || isFirst}
                    onClick={handleBack}
                >
                    Back
                </Button>
                <Button 
                    variant="primary"
                    rightIcon={<ArrowRight size={16} />}
                    disabled={!hasChildren || isLast || !isCurrentStageComplete}
                    onClick={handleNext}
                >
                    Next
                </Button>
            </div>
        </nav>
    );
}