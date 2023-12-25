import React from "react";
import "../css/Members.css";

interface Props {
    playgroundDetails: any
}

export default function Members({ playgroundDetails }: Props) {
    return (
        <>
            <div id="membersBoxContainer">
                {playgroundDetails?.members.map((member: { doodleId: "string", username: string, score: number, totalScore: number }, i: number) => {
                    return (
                        <div className="memberBox" key={i}>{member.username} {member.score} {member.totalScore}</div>
                    );
                })}
            </div>
        </>
    )
}