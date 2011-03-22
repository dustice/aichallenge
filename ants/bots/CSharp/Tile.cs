using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Bot
{
    class Tile
    {
        public enum Type
        {
            UNSEEN,
            WATER,
            FOOD,
            LAND,
            DEAD,
            MY_ANT,
            PLAYER1,
            PLAYER2,
            PLAYER3,
            PLAYER4,
            PLAYER5,
            PLAYER6,
            PLAYER7,
            PLAYER8,
            PLAYER9,
            PLAYER10,
            PLAYER11,
            PLAYER12,
            PLAYER13,
            PLAYER14,
            PLAYER15,
            PLAYER16,
            PLAYER17,
            PLAYER18,
            PLAYER19,
            PLAYER20,
            PLAYER21,
            PLAYER22,
            PLAYER23,
            PLAYER24,
            PLAYER25
        }

        public static char[] symbols = new char[31];

	    Tile(int row, int col)
        {
		    this._row = row;
		    this._col = col;
	    }

	    private int _row;
	    private int _col;

        public static void InitSymbols()
        {
            for (int i = 0; i < 25; i++)
                symbols[i + 6] = (char)('A' + i);
            symbols[(int)Type.UNSEEN] = '0';
            symbols[(int)Type.WATER] = '0';
            symbols[(int)Type.FOOD] = '0';
            symbols[(int)Type.LAND] = '0';
            symbols[(int)Type.DEAD] = '0';
            symbols[(int)Type.MY_ANT] = '0';
        }

        public int row()
        {
		    return this._row;
	    }
	
	    public int col()
        {
		    return this._col;
	    }
	
	    public int hashCode()
        {
		    return this._row * 65536 + this._col;
	    }
	
	    public bool equals(Object o)
        {
		    if (o is Tile) {
			    return this._row == ((Tile)o).row() && this._col == ((Tile)o).col();
		    } else {
			    return false;
		    }
	    }
	
	    public String toString()
        {
		    return "(" + this._row + "," + this._col + ")";
	    }

    }
}
