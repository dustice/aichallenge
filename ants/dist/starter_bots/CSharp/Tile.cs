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
            ANT
        }
        
        public enum Owner
        {
            PLAYER1 = 6,
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
            PLAYER25,
            NONE//Water and food
        }

        public static char[] symbols = new char[31];

	    public Tile(Type type, int row, int col, Owner owner)
        {
            _type = type;
		    _row = row;
		    _col = col;
            _owner = owner;
	    }

        private Type _type;
	    private int _row;
	    private int _col;
        private Owner _owner;

        public static void InitSymbols()
        {
            for (int i = 0; i < 25; i++)
                symbols[i + 6] = (char)('A' + i);
            symbols[(int)Type.UNSEEN] = '0';
            symbols[(int)Type.WATER] = '0';
            symbols[(int)Type.FOOD] = '0';
            symbols[(int)Type.LAND] = '0';
            symbols[(int)Type.DEAD] = '0';
            symbols[(int)Type.ANT] = '0';
        }

        public int row { get { return _row; } }
        public int col { get { return _col; } }
        public Type type { get { return _type; } }
        public int hashCode { get { return _row * 65536 + _col; } }
	
	    public bool equals(Object o)
        {
		    if (o is Tile) {
			    return this._row == ((Tile)o)._row && this._col == ((Tile)o)._col;
		    } else {
			    return false;
		    }
	    }
	
	    public String toString()
        {
		    return "(" + this._row + "," + this._col + ")";
	    }

        public int this [int index, int index2]
        {
            set { }
            get { return 1; }
        }

    }
}
