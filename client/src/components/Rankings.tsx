import React from 'react';
import "../css/Rankings.css";

interface Props {
    rankingsData: any,
    setIsRankingVisible: any
}

export default function Rankings({ rankingsData, setIsRankingVisible }: Props) {
    return (
        <>
            <div id="rankingsContainer">
                <div id="rankingsTitle" className="preventSelect">
                    <div>
                        Rankings
                    </div>
                    <div>
                        <svg id="rankingCloseIcon" onClick={() => { setIsRankingVisible(false); }} viewBox="30.262 -3.5843 512.0997 512.116" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#455d7a" opacity="1.(000000" stroke="none" d="M 397.554 447.23 C 361.478 411.156 325.608 375.375 289.906 339.428 C 286.902 336.403 285.535 336.628 282.663 339.511 C 232.676 389.692 182.592 439.778 132.465 489.818 C 111.644 510.602 82.65 514.362 58.459 499.632 C 27.547 480.809 20.947 437.958 44.789 410.739 C 46.653 408.61 48.649 406.592 50.652 404.589 C 99.903 355.322 149.131 306.03 198.498 256.879 C 201.843 253.549 202.455 251.924 198.699 248.191 C 148.698 198.496 98.882 148.615 49.074 98.726 C 28.255 77.873 24.403 48.815 39.084 24.75 C 58.047 -6.334 100.398 -12.98 127.909 10.835 C 130.049 12.687 132.072 14.679 134.074 16.681 C 183.578 66.168 233.101 115.635 282.493 165.233 C 285.516 168.269 286.941 168.47 290.097 165.299 C 339.944 115.213 389.924 65.26 439.924 15.327 C 460.937 -5.657 490.027 -9.481 514.329 5.374 C 545.329 24.324 551.69 67.661 527.392 94.671 C 524.385 98.013 521.151 101.152 517.97 104.334 C 469.783 152.544 421.619 200.778 373.315 248.872 C 370.312 251.862 370.479 253.224 373.378 256.111 C 423.56 306.097 473.653 356.174 523.684 406.311 C 545.875 428.548 548.52 460.618 530.397 484.862 C 509.709 512.536 469.312 516.749 443.954 493.227 C 428.082 478.504 413.155 462.764 397.554 447.23 Z" />
                        </svg>
                    </div>
                </div>
                <div id="rankingsContent">
                    {
                        (rankingsData.length === 0) ?
                            <>
                                <div id="noRankingsTitle" className="preventSelect">
                                    Play Some Games First
                                </div>
                            </>
                            :
                            <>
                            </>
                    }
                    {rankingsData?.map((rankingData: { username: string, totalScore: number }, i: number) => {
                        return (
                            <div className="rankingBox" key={i}>
                                <div className="rankingBoxInfo">
                                    {i + 1}
                                    <div className="rankingBoxName">{rankingData.username}</div>
                                </div>
                                <div className="rankingBoxTotalScore">{rankingData.totalScore} Points</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    )
}
