import * as React from "react";

import TetrisBoard from "./tetris-board";

type TetrisProps = {
  boardWidth: any;
  boardHeight: any;
};

type TetrisState = {
  activeTileX: number;
  activeTileY: number;
  activeTile: number;
  tileRotate: number;
  score: number;
  level: number;
  tileCount: number;
  gameOver: boolean;
  isPaused: boolean;
  field: any[];
  timerId: any;
  tiles: number[][][][];
};

class Tetris extends React.Component<TetrisProps, TetrisState> {
  constructor(props: any) {
    super(props);

    // 指定した縦幅のブロック分フィールドを生成する
    let field = [];
    for (let y = 0; y < props.boardHeight; y++) {
      let row = [];
      for (let x = 0; x < props.boardWidth; x++) {
        row.push(0);
      }
      field.push(row);
    }

    // タイル落下の初期X座標を指定する
    let xStart = Math.floor(parseInt(props.boardWidth) / 2);

    // 値の初期値を設定する
    this.state = {
      activeTileX: xStart,  // ブロックがある位置のX軸
      activeTileY: 1,       // ブロックがある位置のY軸
      activeTile: 1,        // タイルの種類ID
      tileRotate: 0,        // タイルの回転度合い
      score: 0,             // 点数
      level: 1,             // 難易度
      tileCount: 0,         // タイルの枚数(横揃い判定用)
      gameOver: false,      // ゲームオーバー判定
      isPaused: false,      // 中断判定
      field: field,         // フィールド情報
      timerId: null,        // ボードを更新する処理
      tiles: [          
        [
          [[0, 0], [0, 0], [0, 0], [0, 0]], [[0, 0], [0, 0], [0, 0], [0, 0]],
          [[0, 0], [0, 0], [0, 0], [0, 0]], [[0, 0], [0, 0], [0, 0], [0, 0]]
        ],
        [
          [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [0, 1], [1, 1]],
          [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [0, 1], [1, 1]]
        ],
        [
          [[0, -1], [0, 0], [0, 1], [0, 2]], [[-1, 0], [0, 0], [1, 0], [2, 0]],
          [[0, -1], [0, 0], [0, 1], [0, 2]], [[-1, 0], [0, 0], [1, 0], [2, 0]]
        ],
        [
          [[0, 0], [-1, 0], [1, 0], [0, -1]], [[0, 0], [1, 0], [0, 1], [0, -1]],
          [[0, 0], [-1, 0], [1, 0], [0, 1]], [[0, 0], [-1, 0], [0, 1], [0, -1]]
        ],
        [
          [[0, 0], [-1, 0], [1, 0], [-1, -1]], [[0, 0], [0, 1], [0, -1], [1, -1]],
          [[0, 0], [1, 0], [-1, 0], [1, 1]], [[0, 0], [0, 1], [0, -1], [-1, 1]]
        ],
        [
          [[0, 0], [1, 0], [-1, 0], [1, -1]], [[0, 0], [0, 1], [0, -1], [1, 1]],
          [[0, 0], [1, 0], [-1, 0], [-1, 1]], [[0, 0], [0, 1], [0, -1], [-1, -1]]
        ],
        [
          [[0, 0], [1, 0], [0, -1], [-1, -1]], [[0, 0], [1, 0], [0, 1], [1, -1]],
          [[0, 0], [1, 0], [0, -1], [-1, -1]], [[0, 0], [1, 0], [0, 1], [1, -1]]
        ],
        [
          [[0, 0], [-1, 0], [0, -1], [1, -1]], [[0, 0], [0, -1], [1, 0], [1, 1]],
          [[0, 0], [-1, 0], [0, -1], [1, -1]], [[0, 0], [0, -1], [1, 0], [1, 1]]
        ]
      ]
    };
  }

  /**
   * ゲームを最初からやり直す
   * @memberof Tetris
   */
  handleNewGameClick = () => {
    // 指定した縦幅のブロック分フィールドを生成する
    let field: any[] = [];
    for (let y = 0; y < this.props.boardHeight; y++) {
      let row = [];
      for (let x = 0; x < this.props.boardWidth; x++) {
        row.push(0);
      }
      field.push(row);
    }

    // タイル落下の初期X座標を指定する
    let xStart = Math.floor(parseInt(this.props.boardWidth) / 2);

    // 値の初期値を設定する
    this.setState({
      activeTileX: xStart,
      activeTileY: 1,
      activeTile: 2,
      tileRotate: 0,
      score: 0,
      level: 1,
      tileCount: 0,
      gameOver: false,
      field: field
    });
  };

  /**
   * ゲームを一時停止または再開する
   * @memberof Tetris
   */
  handlePauseClick = () => {
    this.setState(prev => ({
      isPaused: !prev.isPaused
    }));
  };

  /**
   * ゲームスピードの調整を行う
   * @memberof Tetris
   */
  componentDidMount() {
    let timerId;

    timerId = window.setInterval(
      () => this.handleBoardUpdate("down"),
      1000 - (this.state.level * 10 > 600 ? 600 : this.state.level * 10)
    );

    this.setState({
      timerId: timerId
    });
  }

  componentWillUnmount() {
    window.clearInterval(this.state.timerId);
  }

  /**
   * フィールドの描画情報を更新する
   * @param {string} command
   * @memberof Tetris
   */
  handleBoardUpdate(command: string) {
    // ゲームオーバーまたは一時停止中であれば無視する
    if (this.state.gameOver || this.state.isPaused) {
      return;
    }

    // 移動/回転情報などを初期化する
    let xAdd = 0;
    let yAdd = 0;
    let rotateAdd = 0;
    let tile = this.state.activeTile;

    let field = this.state.field;
    let x = this.state.activeTileX;
    let y = this.state.activeTileY;
    let rotate = this.state.tileRotate;

    if (command === "left") {
      xAdd = -1;
    }

    if (command === "right") {
      xAdd = 1;
    }

    if (command === "rotate") {
      rotateAdd = 1;
    }

    if (command === "down") {
      yAdd = 1;
    }

    if (command === "up") {
      console.log(this.props.boardHeight - y);
      yAdd = this.props.boardHeight - y;
    }

    const tiles = this.state.tiles;

    // フィールドから実際のタイルを削除して、新しい挿入位置を代入する
    field[y + tiles[tile][rotate][0][1]][x + tiles[tile][rotate][0][0]] = 0;
    field[y + tiles[tile][rotate][1][1]][x + tiles[tile][rotate][1][0]] = 0;
    field[y + tiles[tile][rotate][2][1]][x + tiles[tile][rotate][2][0]] = 0;
    field[y + tiles[tile][rotate][3][1]][x + tiles[tile][rotate][3][0]] = 0;

    // 横移動できるかの判定
    let xAddIsValid = true;

    // 横に移動するかを確認する
    if (xAdd !== 0) {
      for (let i = 0; i <= 3; i++) {
        // フィールドの外に飛び出さないかを判定する
        if (x + xAdd + tiles[tile][rotate][i][0] >= 0 &&
            x + xAdd + tiles[tile][rotate][i][0] < this.props.boardWidth) {
          if (field[y + tiles[tile][rotate][i][1]][x + xAdd + tiles[tile][rotate][i][0]] !== 0) {
            xAddIsValid = false;
          }
        } else {
          xAddIsValid = false;
        }
      }
    }

    // 横移動が可能であればX座標を更新する
    if (xAddIsValid) {
      x += xAdd;
    }

    // タイルを回転させる
    let newRotate = rotate + rotateAdd > 3 ? 0 : rotate + rotateAdd;
    let rotateIsValid = true;

    // タイルが回転しているかを確認する
    if (rotateAdd !== 0) {
      for (let i = 0; i <= 3; i++) {
        // フィールドから飛び出さずに回転できるかを確認する
        if (
          x + tiles[tile][newRotate][i][0] >= 0 &&
          x + tiles[tile][newRotate][i][0] < this.props.boardWidth &&
          y + tiles[tile][newRotate][i][1] >= 0 &&
          y + tiles[tile][newRotate][i][1] < this.props.boardHeight
        ) {
          // 他のタイルの制御の影響を無視する
          if (field[y + tiles[tile][newRotate][i][1]][x + tiles[tile][newRotate][i][0]] !== 0) {
            rotateIsValid = false;
          }
        } else {
          rotateIsValid = false;
        }
      }
    }

    // 回転可能であれば角度情報を更新する
    if (rotateIsValid) {
      rotate = newRotate;
    }

    // タイルの落下速度向上判定
    let yAddIsValid = true;

    // タイルを高速で落下しても良いのかを判定する
    if (yAdd !== 0) {
      for (let i = 0; i <= 3; i++) {
        // フィールドから飛び出さずに落下できるかを確認する
        if (
          y + yAdd + tiles[tile][rotate][i][1] >= 0 &&
          y + yAdd + tiles[tile][rotate][i][1] < this.props.boardHeight
        ) {
          // 他のブロックの影響を受けていないかを判定する
          if (field[y + yAdd + tiles[tile][rotate][i][1]][x + tiles[tile][rotate][i][0]] !== 0) {
            yAddIsValid = false;
          }
        } else {
          yAddIsValid = false;
        }
      }
    }

    // 高速で落下できる場合はy座標を加算する
    if (yAddIsValid) {
      y += yAdd;
    }

    // タイルの位置座標を更新する
    field[y + tiles[tile][rotate][0][1]][x + tiles[tile][rotate][0][0]] = tile;
    field[y + tiles[tile][rotate][1][1]][x + tiles[tile][rotate][1][0]] = tile;
    field[y + tiles[tile][rotate][2][1]][x + tiles[tile][rotate][2][0]] = tile;
    field[y + tiles[tile][rotate][3][1]][x + tiles[tile][rotate][3][0]] = tile;

    if (!yAddIsValid) {
      for (let row = this.props.boardHeight - 1; row >= 0; row--) {
        let isLineComplete = true;

        // タイルが横一列揃っているのかを判定
        for (let col = 0; col < this.props.boardWidth; col++) {
          if (field[row][col] === 0) {
            isLineComplete = false;
          }
        }

        // 完了した行を削除する
        if (isLineComplete) {
          for (let yRowSrc = row; yRowSrc > 0; yRowSrc--) {
            for (let col = 0; col < this.props.boardWidth; col++) {
              field[yRowSrc][col] = field[yRowSrc - 1][col];
            }
          }

          // 最後の行を取得
          row = this.props.boardHeight;
        }
      }

      // スコアやレベルの情報を更新する
      this.setState(prev => ({
        score: prev.score + 1 * prev.level,
        tileCount: prev.tileCount + 1,
        level: 1 + Math.floor(prev.tileCount / 10)
      }));

      // タイマーIDを初期化する
      let timerId;

      // タイマーをリセット
      clearInterval(this.state.timerId);

      timerId = setInterval(() => this.handleBoardUpdate("down"),1000 - (this.state.level * 10 > 600 ? 600 : this.state.level * 10));

      // タイマーをセット
      this.setState({
        timerId: timerId
      });

      // 新しいタイルを生成する
      tile = Math.floor(Math.random() * 7 + 1);
      x = parseInt(this.props.boardWidth) / 2;
      y = 1;
      rotate = 0;

      // 新しいタイルを置くことができるのか（ゲームオーバーか）を判定する
      if (
        field[y + tiles[tile][rotate][0][1]][x + tiles[tile][rotate][0][0]] !== 0 ||
        field[y + tiles[tile][rotate][1][1]][x + tiles[tile][rotate][1][0]] !== 0 ||
        field[y + tiles[tile][rotate][2][1]][x + tiles[tile][rotate][2][0]] !== 0 ||
        field[y + tiles[tile][rotate][3][1]][x + tiles[tile][rotate][3][0]] !== 0
      ) {
        // ゲームオーバー
        this.setState({
          gameOver: true
        });
      } else {
        // ゲームオーバーでなければ継続してタイルをレンダリング
        field[y + tiles[tile][rotate][0][1]][x + tiles[tile][rotate][0][0]] = tile;
        field[y + tiles[tile][rotate][1][1]][x + tiles[tile][rotate][1][0]] = tile;
        field[y + tiles[tile][rotate][2][1]][x + tiles[tile][rotate][2][0]] = tile;
        field[y + tiles[tile][rotate][3][1]][x + tiles[tile][rotate][3][0]] = tile;
      }
    }

    // フィールドの状態を更新する
    this.setState({
      field: field,
      activeTileX: x,
      activeTileY: y,
      tileRotate: rotate,
      activeTile: tile
    });
  }

  render() {
    return (
      <div className="tetris">
        <h1>テトリス対決</h1>
        <TetrisBoard
          field    = {this.state.field}
          gameOver = {this.state.gameOver}
          score    = {this.state.score}
          level    = {this.state.level}
          rotate   = {this.state.tileRotate}
        />

        <div className="tetris__block-controls">
          <button className="btn" onClick={() => this.handleBoardUpdate("left")}>左に移動</button>
          <button className="btn" onClick={() => this.handleBoardUpdate("down")}>下に移動</button>
          <button className="btn" onClick={() => this.handleBoardUpdate("up")}>上に移動</button>
          <button className="btn" onClick={() => this.handleBoardUpdate("right")}>右に移動</button>
          <button className="btn" onClick={() => this.handleBoardUpdate("rotate")}>回転</button>
        </div>

        <div className="tetris__game-controls">
          <button className="btn" onClick={this.handleNewGameClick}>最初からやり直す</button>
          <button className="btn" onClick={this.handlePauseClick}>{this.state.isPaused ? "再開" : "一時停止"}</button>
        </div>
      </div>
    );
  }
}

export default Tetris;
