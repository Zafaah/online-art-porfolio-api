import { Hono } from 'hono';
import { getArtists,getArtistById, createArtist,updateArtist, deleteArtist} from '../controllers/artistController';
const artistRoute = new Hono();

artistRoute.get('/', getArtists);
artistRoute.get('/:id', getArtistById);
artistRoute.post('/', createArtist);
artistRoute.put('/:id', updateArtist);
artistRoute.delete('/:id', deleteArtist);


export default artistRoute;
