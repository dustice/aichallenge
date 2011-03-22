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
	    private Tile[,] map;
	
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

	    public bool setup(List<String> data) {
            return true;
	    }
	
	    private bool update(List<String> data) {
		    // clear ants and food
		    return true;
	    }
	
	    public void issueOrder(int row, int col, Aim direction) {
		    Console.WriteLine("o " + col + " " + row + " " + direction.symbol);
	    }

	    public void issueOrder(Tile ant, Aim direction) {
		    Console.WriteLine("o " + ant.col() + " " + ant.row() + " " + direction.symbol);
	    }
	
	    public void finishTurn() {
		    Console.WriteLine("go");
		    this._turn++;
	    }
	
	    /*public Set<Tile> myAnts() {
		    Set<Tile> myAnts = new HashSet<Tile>();
		    for (Entry<Tile, Ilk> ant : this.antList.entrySet()) {
			    if (ant.getValue() == Ilk.MY_ANT) {
				    myAnts.add(ant.getKey());
			    }
		    }
		    return myAnts;
	    }
	
	    public Set<Tile> enemyAnts() {
		    Set<Tile> enemyAnts = new HashSet<Tile>();
		    for (Entry<Tile, Ilk> ant : this.antList.entrySet()) {
			    if (ant.getValue().isEnemy()) {
				    enemyAnts.add(ant.getKey());
			    }
		    }
		    return enemyAnts;
	    }
	
	    public Set<Tile> food() {
	    }
	
	    public int distance (Tile t1, Tile t2) {
		    int dRow = Math.Abs(t1.row() - t2.row());
		    int dCol = Math.Abs(t1.col() - t2.col());

		    dRow = Math.Min(dRow, this._rows - dRow);
		    dCol = Math.Min(dCol, this._cols - dCol);
		
		    return dRow * dRow + dCol * dCol;
	    }
	
	    public List<Aim> directions (Tile t1, Tile t2) {
		    List<Aim> directions = new List<Aim>();
		
		    if (t1.row() < t2.row()) {
			    if (t2.row() - t1.row() >= this._rows / 2) {
				    directions.Add(Aim.NORTH);
			    } else {
				    directions.Add(Aim.SOUTH);
			    }
		    } else if (t1.row() > t2.row()) {
			    if (t1.row() - t2.row() >= this._rows / 2) {
				    directions.Add(Aim.SOUTH);
			    } else {
				    directions.Add(Aim.NORTH);
			    }
		    }

		    if (t1.col() < t2.col()) {
			    if (t2.col() - t1.col() >= this._cols / 2) {
				    directions.Add(Aim.WEST);
			    } else {
				    directions.Add(Aim.EAST);
			    }
		    } else if (t1.col() > t2.col()) {
			    if (t1.col() - t2.col() >= this._cols / 2) {
				    directions.Add(Aim.EAST);
			    } else {
				    directions.Add(Aim.WEST);
			    }
		    }
		
		    return directions;
	    }
	
	    public Ilk ilk(Tile location, Aim direction) {
		    Tile new_location = this.tile(location, direction);
		    return this.map[new_location.row()][new_location.col()];
	    }
	
	    public Ilk ilk(Tile location) {
		    return this.map[location.row()][location.col()];
	    }
	
	    public Tile tile(Tile location, Aim direction) {
		    int nRow = (location.row() + direction.dRow) % this._rows;
		    if (nRow < 0) {
			    nRow += this._rows;
		    }
		    int nCol = (location.col() + direction.dCol) % this._cols;
		    if (nCol < 0) {
			    nCol += this._cols;
		    }
		    return new Tile(nRow, nCol);
	    }*/
    }
}
