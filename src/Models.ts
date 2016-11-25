export interface Document {

	id: string;
	name: string;
	// The current text of the document.
	body: string;

	history: string[];
	patches: Patch[];
	// ID of the owner.
	owner: string;
	// People who can vote on patches.
	voters: string;
	// People who must vote on the patches.
	required: string[];
	// People who can veto patches.
	veto: string[];


}

export interface Patch {

	// The body of the patch.
	body: string;
	// People who have approved the patch.
	approved: string[];

}

export interface User {

	username: string;
	salt: string;
	secret: string;

}
