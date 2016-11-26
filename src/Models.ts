export interface Document {

	_id?: any;
	name: string;
	// The current text of the document.
	body: string;

	history: string[];
	patches: Patch[];
	// Username of the owner.
	owner: string;
	// People who can vote on patches.
	voters: string[];
	// People who must vote on the patches.
	required: string[];


}

export interface Patch {

	author: string;

	// The name of the patch.
	name: string;
	// The body of the patch.
	body: string;
	// Votes that have been cast on this patch.
	votes: Vote[];

	// The body of the document after this patch is applied, use for getPatch.
	result?: string;

}

export interface User {

	username: string;
	salt: string;
	secret: string;

}

// Submitted by users.
export interface Authority {

	username: string;
	password: string;

}

// A vote on a document.
export interface Vote {

	name: string;
	vote: boolean;

}

export interface DocumentRequest {
	authority: Authority;
	name: string;
	body: string;
}

export interface AddVoterRequest {

	voterName: string;
	voterRequired: boolean;
	authority: Authority;

}

export interface PatchRequest {

	name: string;
	body: string;
	authority: Authority;

}
