using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Bot
{
    struct Coord
    {
        int x, y;

        public Coord(int x, int y)
        {
            this.x = x;
            this.y = y;
        }
    }

    class Map
    {
        Dictionary<Coord, Tile> map = new Dictionary<Coord, Tile>();

        public void UpdateTile(string type, string xPos, string yPos)
        {
            UpdateTile(type, xPos, yPos, "");
        }

        public void NewTurn()
        {
            List<Coord> removalList = new List<Coord>();
            foreach (Coord coord in map.Keys)
            {
                Tile tile = map[coord];
                if (tile.type == Tile.Type.WATER) continue;

                removalList.Add(coord);
            }

            foreach (Coord coord in removalList)
                map.Remove(coord);
        }

        public void UpdateTile(string type, string xPos, string yPos, string owner)
        {
            //Get Type
            Tile.Type tileType = Tile.Type.UNSEEN;
            switch (type)
            {
                case ("f"):
                    tileType = Tile.Type.FOOD;
                break;
                case ("w"):
                    tileType = Tile.Type.WATER;
                break;
                case ("a"):
                    tileType = Tile.Type.ANT;
                break;
                case ("d"):
                    tileType = Tile.Type.DEAD;
                break;
            }

            int x = Int32.Parse(xPos);
            int y = Int32.Parse(yPos);

            int playerNum = 0;
            if(owner.Length > 0)
                playerNum = Int32.Parse(owner);

            Tile.Owner tileOwner = owner.Length == 0 ? Tile.Owner.NONE : Tile.Owner.PLAYER1 + playerNum;
            Tile newTile = new Tile(tileType, x, y, tileOwner);
            this[x, y] = newTile;
        }

        public Tile this[int index, int index2]
        {
            get { return map[new Coord(index, index2)]; }
            set
            {
                Coord pos = new Coord(index, index2);
                map.Remove(pos);
                map.Add(pos, value);
            }
        }

        public List<Tile> GetTiles()
        {
            List<Tile> retn = new List<Tile>();
            foreach (Coord coord in map.Keys)
                retn.Add(map[coord]);

            return retn;
        }
    }
}
