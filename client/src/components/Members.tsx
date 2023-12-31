import React from "react";
import axios from "axios";
import "../css/Members.css";

interface Props {
    playgroundDetails: any
}

export default function Members({ playgroundDetails }: Props) {
    return (
        <>
            <div id="membersBoxContainer">
                {playgroundDetails?.members.map((member: { doodleId: "string", username: string, active: boolean, score: number, totalScore: number }, i: number) => {
                    return (
                        <div className="memberBox" key={i}>
                            <div className="memberBoxInfo">
                                {
                                    (member.active === true) ?
                                        <>
                                            <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                                                <g>
                                                    <circle r={5} cx={15} cy={15} fill="black" />
                                                    <circle r={8} cx={15} cy={15} stroke="black" fillOpacity={0} />
                                                </g>
                                            </svg>
                                        </>
                                        :
                                        <>
                                            <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                                                <g>
                                                    <circle r={5} cx={15} cy={15} fill="silver" />
                                                    <circle r={8} cx={15} cy={15} stroke="silver" fillOpacity={0} />
                                                </g>
                                            </svg>
                                        </>
                                }
                                <div className="memberBoxName">{member.username}</div>
                            </div>
                            <div className="memberBoxTotalScore">{member.totalScore} Points</div>
                        </div>
                    );
                })}
            </div>
        </>
    )
}