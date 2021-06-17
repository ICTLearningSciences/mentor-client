/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu
The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import React, { useState } from "react";
import ReactPlayer from "react-player";
import { useSelector, useDispatch } from "react-redux";
import { Star, StarBorder } from "@material-ui/icons";
import { videoUrl, subtitleUrl, idleUrl } from "api";
import LoadingSpinner from "components/video-spinner";
import MessageStatus from "components/video-status";
import { chromeVersion } from "utils";
import Switch from "@material-ui/core/Switch";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import {
  answerFinished,
  faveMentor,
  mentorAnswerPlaybackStarted,
} from "store/actions";
import { State } from "types";

const subtitlesSupported = Boolean(!chromeVersion() || chromeVersion() >= 62);

interface VideoData {
  src: string;
  subtitles: string;
}

function Video(args: { playing?: boolean }): JSX.Element {
  const { playing = false } = args;
  const dispatch = useDispatch();
  const curMentor = useSelector<State, string>((state) => state.curMentor);
  const video = useSelector<State, VideoData | null>((state) => {
    if (!state.curMentor) {
      return null;
    }
    const m = state.mentorsById[state.curMentor];
    if (!m) {
      return null;
    }
    return {
      src: state.isIdle ? idleUrl(m.mentor) : videoUrl(m.answer_media || []),
      subtitles:
        subtitlesSupported && !state.isIdle
          ? subtitleUrl(state.curMentor, m.answer_id || "", state.config)
          : "",
    };
  });
  const isIdle = useSelector<State, boolean>((state) => state.isIdle);
  const [duration, setDuration] = useState(Number.NaN);
  if (!(curMentor && video)) {
    return <div />;
  }

  function onEnded() {
    dispatch(answerFinished());
  }

  function onPlay() {
    if (isIdle) {
      return;
    }
    dispatch(
      mentorAnswerPlaybackStarted({
        mentor: curMentor,
        duration: duration,
      })
    );
  }
  const [toggleCaptions, setCaptions] = React.useState(true);

  return (
    <div
      data-cy="video-container"
      data-test-playing={Boolean(playing)}
      data-video-type={isIdle ? "idle" : "answer"}
    >
      <ReactPlayer
        style={{
          backgroundColor: "black",
          position: "relative",
          margin: "0 auto",
        }}
        url={video.src}
        muted={Boolean(isIdle)}
        onDuration={setDuration}
        onEnded={onEnded}
        onPlay={onPlay}
        loop={isIdle}
        controls={!isIdle}
        playing={Boolean(playing)}
        playsinline
        webkit-playsinline="true"
        config={{
          file: {
            tracks: toggleCaptions
              ? [
                  {
                    kind: "subtitles",
                    label: "subtitles",
                    src: video.subtitles,
                    srcLang: "en",
                    default: true,
                  },
                ]
              : [],
          },
        }}
      />
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={toggleCaptions}
              onChange={(e) => {
                setCaptions((prev) => !prev);
                console.log(toggleCaptions ? "ON" : "OFF");
              }}
              data-cy="caption-switch"
            />
          }
          label="Captions"
        />
      </FormGroup>
      {toggleCaptions ? "ON" : "OFF"}
      <FaveButton />
      <LoadingSpinner mentor={curMentor} />
      <MessageStatus mentor={curMentor} />
    </div>
  );
}

function FaveButton() {
  const dispatch = useDispatch();
  const mentor = useSelector<State, string>((state) => state.curMentor);
  const numMentors = useSelector<State, number>(
    (state) => Object.keys(state.mentorsById).length
  );
  const mentorFaved = useSelector<State, string>((state) => state.mentorFaved);

  const onClick = () => {
    dispatch(faveMentor(mentor));
  };

  if (numMentors < 2) {
    return <div />;
  }

  return mentorFaved && mentorFaved === mentor ? (
    <Star
      data-cy="fave-button"
      className="star-icon"
      onClick={onClick}
      style={{ color: "yellow" }}
    />
  ) : (
    <StarBorder
      data-cy="fave-button"
      className="star-icon"
      onClick={onClick}
      style={{ color: "grey" }}
    />
  );
}

export default Video;
