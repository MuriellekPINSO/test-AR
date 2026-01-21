function Arrow(args) {
  let { position, rotation, animation } = args;

  // if (!animation) {
  animation = `property: rotation;
           to: 0 0 10000;
           dur: 3000;
           easing: easeOutExpo;
           startEvents: startSpin;`;

  return (
    <a-entity
      id="arrow"
      position={position}
      rotation={rotation}
      animation__spin={animation}
    >
      <a-cylinder
        position="0 0.3 0"
        radius="0.02"
        height="0.6"
        color="#ff0000"
      ></a-cylinder>

      <a-cone
        position="0 0.7 0"
        radius-bottom="0.06"
        radius-top="0"
        height="0.2"
        color="#ff0000"
      ></a-cone>
    </a-entity>
  );
}

export default Arrow;
