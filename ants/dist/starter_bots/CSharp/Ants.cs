using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Collections;

namespace Bot
{
    public class Aim 
    { 
        public static readonly Aim NORTH = new Aim(0, 1, 'N');
        public static readonly Aim EAST = new Aim(1, 0, 'E');
        public static readonly Aim SOUTH = new Aim(0, -1, 'S');
        public static readonly Aim WEST = new Aim(-1, 0, 'W');


        private int _dCol, _dRow;
        char _symbol;

        public int dCol { get { return _dCol; } }
        public int dRow { get { return _dRow; } }
        public char symbol { get { return _symbol; } }

        public Aim(int dCol, int dRow, char symbol)
        {
            this._dCol = dCol;
            this._dRow = dRow;
            this._symbol = symbol;
        }
    };

    class Ants
    {
        private int _turn = 0;
	    private int _turns = 0;
	    private int _rows = 0;
	    private int _cols = 0;
	    private int _loadtime = 0;
	    private int _turntime = 0;
	    private int _viewradius2 = 0;
	    private int _attackradius2 = 0;
	    private int _spawnradius2 = 0;
        private Map map = new Map();
	
	    public int turn {get {return _turn;} }
        public int turns { get { return _turns; } }
        public int rows { get { return _rows; } }
        public int cols { get { return _cols; } }
        public int loadTime { get { return _loadtime; } }
        public int turnTime { get { return _turntime; } }
        public int viewradius2 { get { return _viewradius2; } }
        public int attackradious2 { get { return _attackradius2; } }
        public int spawnradious2 { get { return _spawnradius2; } }

        public Ants()
        {
            Tile.InitSymbols();
        }

        public void Run()
        {
            string lineInput = Console.ReadLine();
            while(lineInput.Length > 0)
            {
                string[] tokens = lineInput.Split(new char[]{' '});
                string key = tokens[0];
                //string value = tokens[1];

                #region Load Values
                if (key == "turn")
                {
                    _turn = Int32.Parse(tokens[1]);
                    map.NewTurn();
                }
                else if (key == "loadtime")
                    _loadtime = Int32.Parse(tokens[1]);
                else if (key == "turntime")
                    _turntime = Int32.Parse(tokens[1]);
                else if (key == "rows")
                    _rows = Int32.Parse(tokens[1]);
                else if (key == "cols")
                    _cols = Int32.Parse(tokens[1]);
                else if (key == "turns")
                    _turns = Int32.Parse(tokens[1]);
                else if (key == "viewradius2")
                    _viewradius2 = Int32.Parse(tokens[1]);
                else if (key == "attackradius2")
                    _attackradius2 = Int32.Parse(tokens[1]);
                else if (key == "spawnradius2")
                    _spawnradius2 = Int32.Parse(tokens[1]);
                else if (key == "ready")
                {
                    setup();
                    finishTurn();
                }
                #endregion

                #region Per Turn
                else if (key == "go")
                {
                    DoLogic();
                    finishTurn();
                }
                else if (key == "f" || key == "w")//food or water
                    map.UpdateTile(key, tokens[1], tokens[2]);
                else if (key == "a" || key == "d")//ant or dead ant
                    map.UpdateTile(key, tokens[1], tokens[2], tokens[3]);
                #endregion

                lineInput = Console.ReadLine();
            }
            //string lineIn = Console.ReadLine();
            Console.WriteLine(lineInput);
        }

	    public virtual bool setup() {
            return true;
	    }

        public virtual void DoLogic()
        {
        }
	
	    private bool update(List<String> data) {
		    // clear ants and food
		    return true;
	    }
	
	    public void issueOrder(int row, int col, Aim direction) {
		    Console.WriteLine("o " + col + " " + row + " " + direction.symbol);
	    }

	    public void issueOrder(Tile ant, Aim direction) {
		    Console.WriteLine("o " + ant.col + " " + ant.row + " " + direction.symbol);
	    }
	
	    public void finishTurn() {
		    Console.WriteLine("go");
		    this._turn++;
	    }

    }
}
